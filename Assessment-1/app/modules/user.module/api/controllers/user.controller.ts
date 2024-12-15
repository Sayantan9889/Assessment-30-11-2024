import { IUser } from "@interfaces";
import userRepo from "../repositories/user.repositories";
import { Request, Response } from "express";

class userController {

    async createUser(req: Request, res: Response): Promise<any> {
        try {
            const token = req.cookies['x-access-token'] || req.headers['x-access-token'];
            const body: IUser = req.body;

            const newUser: IUser = await userRepo.addUser(req, body, token);

            return res.status(200).json({
                status: 200,
                message: `${newUser.name} thank you for Registering! A verification email will be sent to your mail. Please verify and login.`,
                user: newUser,
            });
        } catch (error: any) {
            console.error("error registering: ", error);
            // req.flash('massage', [error.messages ? error.messages : 'Server Error', 'danger']);
            // return res.redirect('/add/member');
            return res.status(500).json({
                status: 500,
                message: error.message || "Something went wrong! Please try again.",
                error: error,
            });
        }
    }

    async verifyEmail(req: Request, res: Response): Promise<any> {
        try {
            const verificationToken: string = req.params.token;

            await userRepo.emailVerify(verificationToken)

            // return res.redirect(`http://localhost:4200/login?verified=true`);
            return res.status(200).json({
                status: 200,
                message: "Email verified successfully! You can now login.",
            });
        } catch (error: any) {
            console.error("error: ", error);
            // return res.redirect(`http://localhost:4200/login?verified=false`);
            return res.status(500).json({
                status: 500,
                message: error.message || "Something went wrong! Please try again.",
                error: error,
            });
        }
    }

    async loginUser(req: Request, res: Response): Promise<any> {
        try {

            const { user, token } = await userRepo.login(req.body);

            res.cookie('x-access-token', token, {
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            });

            return res.status(200).json({
                status: 200,
                message: `Welcome ${user.name}!`,
            });
        } catch (error: any) {
            console.error("Login error:", error);
            return res.status(500).json({
                status: 500,
                message: "An unexpected error occurred. Please try again later.",
            });
        }
    }

    async logoutUser(req: Request, res: Response): Promise<any> {
        try {
            req.user = undefined;
            res.clearCookie('x-access-token');
            return res.status(200).json({
                status: 200,
                message: "Logged out successfully!"
            });
        } catch (error) {
            console.error("Logout error:", error);
            return res.status(500).json({
                status: 500,
                message: "An unexpected error occurred. Please try again later.",
            });
        }
    }

    async getUserProfile(req: Request, res: Response): Promise<any> {
        try {
            const userId: string = req.params.id;
            const user: IUser | null = await userRepo.fetchProfile(userId);

            if (!user) {
                return res.status(404).json({
                    status: 404,
                    message: "User not found!",
                });
            }

            return res.status(200).json({
                status: 200,
                message: "User profile fetched successfully!",
                data: user
            });
        } catch (error: any) {
            console.log("error: ", error);
            return res.status(500).json({
                status: 500,
                message: error.message || "Something went wrong! Please try again.",
                error: error,
            })
        }
    }

    async updateUserProfile(req: Request, res: Response): Promise<any> {
        try {
            const userId: string = req.params.id;
            const body = req.body;
            body.password && delete body.password;
            body.role && delete body.role;
            body.isVarified && delete body.isVarified;
            body.isActive && delete body.isActive;

            const user: IUser | null = await userRepo.editUser(req, userId, body);

            return res.status(200).json({
                status: 200,
                message: "Profile updated successfully!",
                data: user,
            });
        } catch (error: any) {
            console.log("error: ", error);
            return res.status(500).json({
                status: 500,
                message: error.message || "Something went wrong! Please try again.",
                error: error,
            })
        }
    }

}

export default new userController();