const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function buildUnitTree(flatUnits) {
    const unitMap = new Map();
    const roots = [];

    // Initialize map
    for (const unit of flatUnits) {
        unitMap.set(unit.id, { ...unit, children: [] });
    }

    // Build tree
    for (const unit of flatUnits) {
        const node = unitMap.get(unit.id);
        if (unit.parentId && unitMap.has(unit.parentId)) {
            unitMap.get(unit.parentId).children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

async function test() {
    const units = await prisma.unit.findMany({
        select: { id: true, name: true, type: true, parentId: true, commanderId: true }
    });
    console.log("Units length:", units.length);
    const tree = buildUnitTree(units);
    console.log("Tree roots length:", tree.length);
    console.log(JSON.stringify(tree, null, 2));
}

test().finally(() => process.exit(0));
