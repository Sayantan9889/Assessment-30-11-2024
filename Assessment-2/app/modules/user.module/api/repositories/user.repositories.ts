import { Request } from "express";
import { comparePassword, generateToken, hashPassword, sendVerificationEmail, verifyToken } from "@utils";
import { IUser, IMailOptions, IVerificationToken, ITokenUser } from "@interfaces";
import { userModel, userValidator } from "../models/user.model";
import { verify } from "jsonwebtoken";
import { unlink } from "fs";
import path from "path";
import { Types } from "mongoose";

class userRepo {
    async findOneBy(key: string, value: string): Promise<IUser | null> {
        try {
            const user: Array<IUser> = await userModel.aggregate([
                { $match: { [key]: value } },
                {
                    $project: {
                        _id: 1,
                        image: 1,
                        name: 1,
                        email: 1,
                        password: 1,
                        role: 1,
                        isVarified: 1,
                        isActive: 1,
                        timeZone: 1,
                        createdAt: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        // updatedAt: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }
                    }
                }
            ]);
            return user.length > 0 ? user[0] : null;
        } catch (error: any) {
            throw new Error(error.message || 'Something went wrong while finding user!');
        }
    }

    async addUser(req: Request, body: IUser, token: string) {
        try {
            const creator: ITokenUser = verify(token, process.env.JWT_SECRET!) as ITokenUser;

            if (!(creator?.role === 'super-admin')) {
                // req.flash('message', ['Only super admins can create users', 'warning']);
                // return res.redirect('/add/member');
                throw new Error(`Only super admins can create ${body.role}`);
            }

            const existUser: IUser | null = await this.findOneBy('email', body.email)
            if (existUser) {
                throw new Error("Email already exists!");
            }

            if (body.password !== body.confirmPassword) {
                throw new Error("Passwords do not match!");
            }

            const hashedPassword: string = await hashPassword(body.password);
            body.password = hashedPassword;
            delete body.confirmPassword;

            const file: any = req.file;
            const basePath: string = `${req.protocol}://${req.get('host')}`;
            let imagePath: string = `${basePath}/uploads/blank-profile-pic.jpg`;
            if (file) {
                imagePath = `${basePath}/uploads/${file.filename}`;
                // console.log("imagePath: ", imagePath);
            }
            body.image = imagePath;

            const { error } = userValidator.validate(body);
            if (error) {
                throw error;
            }

            const verificationToken: string = await generateToken({ email: body.email });

            let verification_mail: string = `http://${req.headers.host}/account/confirmation/${verificationToken}`;
            const mailOptions: IMailOptions = {
                from: 'no-reply@sayantan.com',
                to: body.email,
                subject: 'Account Verification',
                html: `
                <h1>Hello, ${body.name}</h1>
                <p>Please verify your account by clicking the link below:</p>
                <a href="${verification_mail}" style="color: blue;">${verification_mail}</a>
                <p>Thank you!</p>
            `
            };

            await sendVerificationEmail(mailOptions);

            const data = new userModel(body);
            const newUser: IUser = await data.save();
            return newUser;
        } catch (error) {
            throw error
        }
    }

    async emailVerify(token: string) {
        try {
            const tokenData: IVerificationToken = await verifyToken(token)

            const user: IUser | null = await this.findOneBy('email', tokenData.email);

            if (!user) {
                throw new Error("Invalid verification token!")
            }

            await userModel.findByIdAndUpdate(user._id, { isVarified: true, isActive: true });
        } catch (error) {
            throw error;
        }
    }
    async login(body: any): Promise<any> {
        try {
            const { email, password } = body;
            const user: IUser | null = await this.findOneBy('email', email);

            if (!user || !user.isVarified || !(await comparePassword(password, user.password))) {
                throw new Error(!user ? "Invalid email or password!" :
                    (!user.isVarified ? "Your account is not verified. Please check your email for the verification link." :
                        "Invalid email or password!"))
            }

            const token: string = await generateToken({
                id: user._id,
                name: user.name,
                image: user.image,
                email: user.email,
                role: user.role,
                timeZone: user.timeZone,
            });

            return { user, token }
        } catch (error) {
            throw error;
        }
    }

    async editUser(req: Request, userId: string, body: any): Promise<IUser | null> {
        try {
            const existingUser = await userModel.findById(userId).select('-isActive -isVarified');

            if (!existingUser) {
                throw new Error("User not found!");
            }

            const file = (req.files as any)[0];
            if (file) {
                const basePath: string = `${req.protocol}://${req.get('host')}`;
                const imagePath: string = `${basePath}/uploads/${file.filename}`;
                body.image = imagePath;

                const existingImageName: string | undefined = existingUser.image.split('/').pop();
                if (existingImageName && existingImageName !== 'blank-profile-pic.jpg') {
                    unlink(path.join(__dirname, '..', '..', 'uploads', existingImageName), (err) => {
                        if (err) console.error(`Error deleting image: ${err}`);
                        else {
                            console.log('Old images deleted successfully');
                        }
                    });
                }
            }

            const user: IUser = await userModel.findByIdAndUpdate(userId, body, { new: true }).select('-isActive -isVarified -updated_at -password');
            return user;
        } catch (error) {
            throw error;
        }
    }

    async fetchProfile(id: string): Promise<IUser|null> {
        try {
            const userId = new Types.ObjectId(id);

            const users: Array<IUser | null> = await userModel.aggregate([
                {
                    $match: {
                        _id: userId
                    }
                },
                {
                    $project: {
                        "isActive": 0,
                        "isVarified": 0,
                        "updatedAt": 0,
                        "password": 0
                    }
                }
            ])
            return users.length > 0? users[0] : null;
        } catch (error) {
            throw error;
        }
    }
}

export default new userRepo();