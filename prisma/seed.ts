import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
    const email = 'admin@geoguard.com'
    const password = await bcrypt.hash('admin123', 12)

    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Admin User',
            password,
            role: Role.ADMIN,
        },
    })

    console.log({ admin })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
