import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from "bcryptjs"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash)
}
