const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.user.count();
        // מדפיסים רק את המספר כדי שה-Bash יוכל לקרוא אותו בקלות
        process.stdout.write(count.toString());
    } catch (e) {
        process.stdout.write('0');
    } finally {
        await prisma.$disconnect();
    }
}

main();
