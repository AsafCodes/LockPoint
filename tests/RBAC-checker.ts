import { PrismaClient } from '@prisma/client';
import { validateGrantAuthorization } from '../src/lib/auth/commander-visibility';
import { grantPermission, revokePermission } from '../src/lib/auth/permission-manager';

const prisma = new PrismaClient();

async function runRbacChecks() {
    console.log('🛡️  מתחיל סדרת מבדקי QA מקיפים: LockPoint RBAC (Zero Trust) ---\n');

    // ── 1. הכנת הנתונים (Test Data Setup) ──
    const scMaster = await prisma.user.findUnique({ where: { serviceNumber: 'master' } }); // הגדרות גלובליות
    const asafC = await prisma.user.findUnique({ where: { serviceNumber: '8494326' } }); // מג"ד (גדוד 7490)
    const israeliC = await prisma.user.findUnique({ where: { serviceNumber: '7523495' } }); // מ"פ לוגיסטיקה
    const yossiC = await prisma.user.findUnique({ where: { serviceNumber: '5873933' } }); // מ"פ תאג"ד
    const soldierUser = await prisma.user.findFirst({ where: { role: 'soldier' } }); // חייל כלשהו

    // יחידות
    const bn7490 = await prisma.unit.findUnique({ where: { id: 'bn-7490' } });
    const coyLog = await prisma.unit.findUnique({ where: { id: 'coy-log' } });
    const coyTaagad = await prisma.unit.findUnique({ where: { id: 'coy-taagad' } });

    if (!scMaster || !asafC || !israeliC || !yossiC || !soldierUser || !bn7490 || !coyLog || !coyTaagad) {
        console.error('❌ חסרים נותני בסיס (DB Seed). אנא הרץ npx prisma db seed.');
        return;
    }

    let passCount = 0;
    let failCount = 0;

    async function assert(name: string, condition: boolean, expectedError?: string, actualError?: string) {
        if (condition) {
            console.log(`✅ [PASS] ${name}`);
            passCount++;
        } else {
            console.error(`❌ [FAIL] ${name}`);
            if (expectedError && actualError) {
                console.error(`   Expected: ${expectedError} | Actual: ${actualError}`);
            }
            failCount++;
        }
    }

    // ניקוי מלא למעבדה נקייה לפני תחילת המבדקים
    await prisma.userPermission.deleteMany({
        where: { userId: { in: [asafC.id, israeliC.id, yossiC.id] } }
    });

    console.log('\n===============================================================');
    console.log('1️⃣ עקרון Zero Trust (Role != Permission)');
    console.log('מתוך User Guide: "התפקיד בלבד אינו מספיק", SC לא יכול לעשות הכל.');
    console.log('===============================================================');

    // ניסיון של מג"ד (Role = commander אבל 0 הרשאות) לאשר נראות
    const ztRes1 = await validateGrantAuthorization(asafC.id, yossiC.id, israeliC.id, false);
    await assert('Zero Trust: מפקד גדוד (ללא הרשאה ב-DB) נחסם למרות תפקידו',
        ztRes1.allowed === false && ztRes1.code === 'UNAUTHORIZED_ROLE');

    // ניסיון של SC-001 (נוריד לו זמנית את ההרשאה)
    const masterPerm = await prisma.userPermission.findUnique({
        where: { userId_permissionCode: { userId: scMaster.id, permissionCode: 'MANAGE_VISIBILITY_GRANTS' } }
    });
    if (masterPerm) {
        await prisma.userPermission.delete({
            where: { userId_permissionCode: { userId: scMaster.id, permissionCode: 'MANAGE_VISIBILITY_GRANTS' } }
        });
    }
    const ztRes2 = await validateGrantAuthorization(scMaster.id, israeliC.id, yossiC.id, false);
    await assert('Zero Trust: מפקד בכיר SC-001 (ללא הרשאה) נחסם - תפקיד אינו עוקף חוסר הרשאה פנימית',
        ztRes2.allowed === false && ztRes2.code === 'UNAUTHORIZED_ROLE');

    // החזרת ההרשאה ל-SC-001 להמשך תקין של המבדקים
    if (masterPerm) {
        await prisma.userPermission.create({ data: masterPerm });
    }


    console.log('\n===============================================================');
    console.log('2️⃣ הפרדת רשויות (Separation of Duties - Anti Self-Grant)');
    console.log('מתוך Admin Guide: "לעולם לא תוכל להעניק/לבטל הרשאה למשתמש שלך"');
    console.log('===============================================================');

    // SC מנסה לתת לעצמו הרשאה נוספת או מחדש מישהו יכול להעניק לעצמו?
    const sodRes1 = await grantPermission(asafC.id, asafC.id, 'MANAGE_ZONES');
    await assert('Anti Self-Grant: מערכת API דוחה ניסיון של משתמש להעניק הרשאה לעצמו',
        sodRes1.success === false && sodRes1.code === 'SELF_GRANT');

    // נעניק לאסף הרשאה חוקית (על ידי ה-SC) ואז אסף ינסה להסיר את זה מעצמו (כדי לטשטש עקבות לדוגמה)
    await grantPermission(scMaster.id, asafC.id, 'MANAGE_ZONES', bn7490.id, 'QA Setup');
    const sodRes2 = await revokePermission(asafC.id, asafC.id, 'MANAGE_ZONES');
    await assert('Anti Self-Revoke: מערכת מונעת ממשתמש לבטל את ההרשאות של עצמו',
        sodRes2.success === false && sodRes2.code === 'SELF_GRANT');

    // SC חוקי של המערכת מסיר לאסף כנדרש (ניקוי)
    await revokePermission(scMaster.id, asafC.id, 'MANAGE_ZONES');


    console.log('\n===============================================================');
    console.log('3️⃣ אכיפת גזרה (Scope & Hierarchy Enforcement)');
    console.log('מתוך User Guide: "פעולתה ננעלת רק לאותה הגזרה... חוסמת כל חריגה מה-Scope"');
    console.log('===============================================================');

    // ניתן לאסף הרשאת MANAGE_VISIBILITY רק לגזרת הלוגיסטיקה (למרות שהוא מג"ד בארגון)
    // כך נבודד את ה-Scope עצמו מהיחידה האורגנית. התלות היא *אך ורק* ב-Scope שניתן בהרשאה.
    await grantPermission(scMaster.id, asafC.id, 'MANAGE_VISIBILITY_GRANTS', coyLog.id, 'בדיקת גזרה כפויה');

    // אסף (עם הרשאה לפלוגת הלוגיסטיקה) מנסה לתת למ"פ לוגיסטיקה הרשאה לראות את מ"פ תאג"ד הזר
    const scopeRes1 = await validateGrantAuthorization(asafC.id, israeliC.id, yossiC.id, false);
    await assert('Scope Check: חסימת יעד (Target) שאינו שייך לתת-הגזרה המורשית בהרשאה',
        scopeRes1.allowed === false && scopeRes1.code === 'OUTSIDE_HIERARCHY');

    // אסף מנסה לתת למ"פ תאג"ד לראות את הלוגיסטיקה (הענק אינו בגזרה)
    const scopeRes2 = await validateGrantAuthorization(asafC.id, yossiC.id, israeliC.id, false);
    await assert('Scope Check: חסימת מקבל (Grantee) שאינו שייך לתת-הגזרה המורשית',
        scopeRes2.allowed === false && scopeRes2.code === 'OUTSIDE_HIERARCHY');

    // ניקוי
    await revokePermission(scMaster.id, asafC.id, 'MANAGE_VISIBILITY_GRANTS');


    console.log('\n===============================================================');
    console.log('4️⃣ תפוגה אוטומטית (Privilege Creep Prevention)');
    console.log('מתוך User Guide: "כאשר התאריך מגיע, המערכת שוללת את ההרשאה אוטומטית"');
    console.log('===============================================================');

    // הענקת הרשאה גלובלית (scope = null) שפגה אתמול
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await grantPermission(scMaster.id, asafC.id, 'MANAGE_VISIBILITY_GRANTS', null, 'QA טסט תפוגה', yesterday);

    const expRes = await validateGrantAuthorization(asafC.id, israeliC.id, israeliC.id, false);
    // הטסט ייפול גם על SELF_GRANT אבל לפני זה חייב ליפול על פג תוקף!
    await assert('Auto-Expiry: הרשאה הקיימת במסד הנתונים נחסמת כי תאריך ה-expiresAt עבר',
        expRes.allowed === false && (expRes.error?.includes('פגה') ?? false));

    // ניקוי עמוק כי revoke לא יעבוד (סיבות תפוגה וכו)
    await prisma.userPermission.deleteMany({ where: { userId: asafC.id } });


    console.log('\n===============================================================');
    console.log('5️⃣ מניעת כפילויות (Duplicate Prevention)');
    console.log('מתוך Admin Guide: "המערכת מונעת כפילויות בהענקת הרשאות"');
    console.log('===============================================================');

    // SC נותן למג"ד אסף הרשאה כשרה פעם אחת
    const dupRes1 = await grantPermission(scMaster.id, asafC.id, 'MANAGE_ZONES', bn7490.id);
    await assert('Duplicate Prevention: יצירת הרשאה ראשונה מצליחה כצפוי', dupRes1.success === true);

    // ניסיון לתת לו שנית את אותה הרשאה
    const dupRes2 = await grantPermission(scMaster.id, asafC.id, 'MANAGE_ZONES', bn7490.id);
    await assert('Duplicate Prevention: בניסיון השני, מערכת מזהה כפילות ודוחה בקידוד מתאים',
        dupRes2.success === false && dupRes2.code === 'DUPLICATE');

    // SC חוקי של המערכת מסיר לאסף כנדרש (ניקוי)
    await revokePermission(scMaster.id, asafC.id, 'MANAGE_ZONES');


    console.log('\n===============================================================');
    console.log('6️⃣ חוקי יישות והרשאת נראות (Entity & Visibility Constraints)');
    console.log('מתוך Design: חסימת טיפוסי מידע שגויים (חיילים), מניעת כפילויות, ומניעת נראות עצמית');
    console.log('===============================================================');

    // נותנים הרשאה נקייה
    await grantPermission(scMaster.id, asafC.id, 'MANAGE_VISIBILITY_GRANTS', bn7490.id, 'QA Setting up Visibility Checks');

    // צפייה בעצמו
    const visSelfRes = await validateGrantAuthorization(asafC.id, israeliC.id, israeliC.id, false);
    await assert('Entity Logic: מניעת מתן הרשאה למפקד על עצמו',
        visSelfRes.allowed === false && visSelfRes.code === 'SELF_GRANT');

    // צפייה של חייל
    const visGranteeSoldierRes = await validateGrantAuthorization(asafC.id, soldierUser.id, israeliC.id, false);
    await assert('Entity Logic: דחיית הענקת הרשאה לחייל במקום מפקד מתאים',
        visGranteeSoldierRes.allowed === false && visGranteeSoldierRes.code === 'INVALID_GRANTEE');

    // צפייה ביעד מחוץ לתפקיד (חייל)
    const visTargetSoldierRes = await validateGrantAuthorization(asafC.id, israeliC.id, soldierUser.id, false);
    await assert('Entity Logic: דחיית הגדרת יעד לצפייה שאיננו קצין אלא חייל',
        visTargetSoldierRes.allowed === false && visTargetSoldierRes.code === 'INVALID_TARGET');

    // כפילויות בפעולת Visibility ספציפית
    await prisma.commanderVisibilityGrant.deleteMany({
        where: { grantedToId: israeliC.id, targetCommanderId: yossiC.id }
    });
    await prisma.commanderVisibilityGrant.create({
        data: { grantedToId: israeliC.id, targetCommanderId: yossiC.id, grantedById: scMaster.id, viewerPublicKey: 'test-qa', reason: 'QA Duplicate test' }
    });
    const dupVisRes = await validateGrantAuthorization(asafC.id, israeliC.id, yossiC.id, true);
    await assert('Duplicate Vis: מניעת כפילות של הקצאת נראות על אותו זוג מפקדים',
        dupVisRes.allowed === false && dupVisRes.code === 'DUPLICATE_GRANT');

    // Cleanup
    await revokePermission(scMaster.id, asafC.id, 'MANAGE_VISIBILITY_GRANTS');
    await prisma.commanderVisibilityGrant.deleteMany({
        where: { grantedToId: israeliC.id, targetCommanderId: yossiC.id, reason: 'QA Duplicate test' }
    });

    console.log('\n===============================================================');
    console.log('7️⃣ בחינת Scope גלובלי (Global Access Bypass)');
    console.log('מתוך Design: אם ה-scopeUnitId הוא null, המשתמש יכול לפעול על פני כל הצבא');
    console.log('===============================================================');

    // נעניק לאסף הרשאה לנהל נראות, אבל הפעם גלובלית (null) ולא מוגבלת לגדוד/פלוגה שלו
    await grantPermission(scMaster.id, asafC.id, 'MANAGE_VISIBILITY_GRANTS', null, 'QA Global Access Setup');

    // קודם, הפעולה של לתת למ"פ לוגיסטיקה לראות את מ"פ תאג"ד כמעט ונחסמה כשנתנו לו סקופ של לוגיסטיקה לבד
    // עכשיו, בסקופ גלובלי - זה אמור לעבור!
    const globalRes = await validateGrantAuthorization(asafC.id, israeliC.id, yossiC.id, false);
    await assert('Global Scope: מפקד עם הרשאה גלובלית (null) עוקף את חוסמי גבולות היחידה בממשק ההרשאות',
        globalRes.allowed === true);

    // ניקוי
    await revokePermission(scMaster.id, asafC.id, 'MANAGE_VISIBILITY_GRANTS', 'QA Cleanup');

    console.log('\n===============================================================');
    console.log('8️⃣ יומן ביקורת קשיח (Immutable Audit Trail)');
    console.log('מתוך Admin Guide: כל פעולה נרשמת במסד הנתונים באופן מוצפן ולא הפיך');
    console.log('===============================================================');

    // נבדוק שהפעולה של Revoke מקודם אכן נשמרה במסד הנתונים מאחורי הקלעים
    const auditLogs = await prisma.auditLog.findMany({
        where: {
            userId: scMaster.id, // מי שביטל
            action: 'PERMISSION_REVOKED',
            detail: {
                contains: 'MANAGE_VISIBILITY_GRANTS'
            }
        },
        orderBy: { timestamp: 'desc' },
        take: 1
    });

    await assert('Audit Logger: מערכת מתעדת כהלכה ביטולי הרשאה עוקבים בטבלת יומן הפעולות',
        auditLogs.length > 0 && auditLogs[0].action === 'PERMISSION_REVOKED');

    // נוודא שיש תיעוד גם כשפעולה נכשלת (ננסה לעשות Self-Grant)
    await grantPermission(israeliC.id, israeliC.id, 'MANAGE_VISIBILITY_GRANTS');
    const deniedLogs = await prisma.auditLog.findMany({
        where: {
            userId: israeliC.id,
            action: 'PERMISSION_DENIED',
            detail: { contains: 'SELF_GRANT' }
        },
        orderBy: { timestamp: 'desc' },
        take: 1
    });

    await assert('Audit Logger: מערכת מתעדת אוטומטית כישלונות פריצה/ייפוי כוח עצמי (PERMISSION_DENIED)',
        deniedLogs.length > 0 && deniedLogs[0].action === 'PERMISSION_DENIED');


    console.log('\n===============================================================');
    console.log('9️⃣ קצוות מקרים ואמינות שליפה (Edge Cases & Query Fidelity)');
    console.log('מתוך API Design: חיפוש משתמשים חסרים, וסינון אוטומטי של הרשאות פגות תוקף בשאילתות');
    console.log('===============================================================');

    // מקרה קצה: קוד הרשאה שלא קיים במערכת בכלל
    const invalidPermRes = await grantPermission(scMaster.id, asafC.id, 'MAKE_ME_COFFEE_PERMISSION');
    await assert('Edge Case: דחיית הענקת קוד הרשאה פיקטיבי שלא קיים בטבלת ההרשאות',
        invalidPermRes.success === false && invalidPermRes.code === 'INVALID_PERMISSION');

    // אמינות שליפה וקצוות מקרים של משתמשים חסרים: המערכת אמורה לשלוף רק הרשאות אקטיביות
    // נעניק 2 הרשאות לאסף: אחת פעילה שגם תשמש אל הטסט של משתמש חסר, אחת מתה
    const qPast = new Date();
    qPast.setDate(qPast.getDate() - 5);
    const qFuture = new Date();
    qFuture.setDate(qFuture.getDate() + 5);

    await grantPermission(scMaster.id, asafC.id, 'MANAGE_VISIBILITY_GRANTS', null, 'QA Active', qFuture);
    await grantPermission(scMaster.id, asafC.id, 'MANAGE_ZONES', null, 'QA Expired', qPast);

    // מקרה קצה: משתמש שלא קיים ב-DB (אסף כבר קיבל את ההרשאה החוקית כדי לעבור את השער הראשון)
    const fakeId = 'cuid-fake-12345';
    const notFoundRes = await validateGrantAuthorization(asafC.id, fakeId, israeliC.id, false);
    await assert('Edge Case: דחיית בקשת גישה עבור משתמש יעד או מקבל שלא קיים ב-DB',
        notFoundRes.allowed === false && notFoundRes.code === 'NOT_FOUND', 'NOT_FOUND', notFoundRes.code);

    const { getUserPermissions } = await import('../src/lib/auth/permission-manager');
    const activePerms = await getUserPermissions(asafC.id);

    // אמור למצוא רק את MANAGE_VISIBILITY_GRANTS כי ZONES פג תוקף בזמן השאילתה!
    await assert('Query Fidelity: הפונקציה getUserPermissions מסננת בהצלחה הרשאות שפג תוקפן',
        activePerms.length === 1 && activePerms[0].permissionCode === 'MANAGE_VISIBILITY_GRANTS');

    // ניקוי עמוק
    await prisma.userPermission.deleteMany({ where: { userId: asafC.id } });

    console.log('\n===============================================================');
    console.log('10. שלמות טיפוסית וגיבוי בסיס נתונים (Referential Integrity)');
    console.log('מתוך DB Schema: אכיפת Foreign Keys כדי למנוע מחיקת משתמשים בעלי הרשאות אקטיביות, וטיפול בביטולי סרק');
    console.log('===============================================================');

    // ביטול סרק: מנסים לשלול ממפקד הרשאה שמעולם לא הייתה לו
    const emptyRevokeRes = await revokePermission(scMaster.id, israeliC.id, 'VIEW_AUDIT_LOGS');
    await assert('Revoke Edge Case: דחיית ניסיון לבטל הרשאה שאיננה קיימת למשתמש היעד',
        emptyRevokeRes.success === false && emptyRevokeRes.code === 'NOT_FOUND');

    // מחיקת משתמש (Referential Integrity restriction):
    // נעניק ליוסי (מ"פ תאג"ד) הרשאה, ואז ננסה למחוק את יוסי מהמערכת ב-ORM.
    // מכיוון שלא הגדרנו onDelete: Cascade במודל UserPermission, הוא יעוף על Foreign Key!
    // זה מנגנון הגנה מצוין למניעת מחיקת משתמשים עם כוח ללא שלילת הכוח קודם לכן.
    await grantPermission(scMaster.id, yossiC.id, 'MANAGE_ZONES');
    let deleteFailed = false;
    try {
        await prisma.user.delete({ where: { id: yossiC.id } });
    } catch (e: any) {
        // Prisma יכול לזרוק P2003 או שגיאת Connector מקורית מ-PostgreSQL (קוד 23001)
        if (e.code === 'P2003' || (e.message && e.message.includes('foreign key constraint'))) {
            deleteFailed = true;
        }
    }

    await assert('DB Integrity: מסד הנתונים חוסם ברמת SQL מחיקת משתמש שיש לו הרשאות פעילות (onDelete: Restrict)',
        deleteFailed === true);

    // ניקוי עמוק (נבטל את הכוח כדי שהסביבה תישאר נקייה לריצות הבאות)
    await revokePermission(scMaster.id, yossiC.id, 'MANAGE_ZONES');

    console.log('\n===============================================================');
    console.log('📊 סיכום מערך QA');
    console.log('===============================================================');
    console.log(`✅ Passed:  ${passCount}`);
    console.log(`❌ Failed:  ${failCount}`);

    if (failCount === 0) {
        console.log('\n🛡️  COMPLIANT: מערכת ה-RBAC מתפקדת בצורה מושלמת לפי כל כללי ה-Zero Trust ואלקטרוניקת ההרשאות המתוארים במסמכי האפיון!');
    } else {
        console.log('\n⚠️  NON-COMPLIANT: זוהו כשלי אבטחה מול האפיון.');
    }
}

runRbacChecks()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
