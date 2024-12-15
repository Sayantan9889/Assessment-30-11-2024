import { Document } from "mongoose";

export interface IUser extends Document {
    _id: string;
    id?: string;
    image: string;
    name: string;
    email: string;
    password: string;
    role: 'super-admin' | 'admin' | 'user';
    isVarified: boolean;
    isActive: boolean;
    confirmPassword?: string;
    timeZone: string;
}

export interface ITokenUser {
    id: string;
    name: string;
    image: string;
    email: string;
    role: 'super-admin' | 'admin' | 'user';
    isVarified?: boolean;
    timeZone?: string;
}

export interface IMailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
}

export interface IVerificationToken {
    email: string;
}