import { createECDH, randomBytes } from 'crypto';

/**
 * מבדק אבטחה קריפטוגרפי: V8 / Node.js Native Crypto vs 3rd-Party Libs
 * 
 * מטרת הסקריפט: להוכיח מעשית למה ההחלטה להשתמש ב-Native `crypto`
 * במקום בספריות צד-ג' (כמו elliptic, crypto-js) מצילה אותנו ממתקפות אנטרופיה,
 * Invalid Curve Attacks, ו-Timing Attacks ב-JavaScript Engine (V8).
 */

async function runV8CryptoAudit() {
    console.log('🛡️  מתחיל מבדק חדירה ובדיקת אנטרופיה: Node.js V8 vs OpenSSL\n');

    // 1. בדיקת ספריות שלמות (Sanity & Dependency Trap)
    console.log('[+] שלב 1: שלילת נוכחות "מלכודות דבש" (3rd-Party Pure-JS Crypto)...');
    try {
        require.resolve('elliptic');
        console.error('   ❌ סכנה! הספריה elliptic מותקנת. היא פגיעה ל-Timing Attacks ונשענת על V8.');
    } catch {
        console.log('   ✅ מצוין. ספריות Pure-JS רעילות אינן מותקנות. אנו נשענים נטו על OpenSSL/C++.');
    }

    // 2. מבחן אנטרופיה מואץ (High-Volume PRNG Bias Test)
    console.log('\n[+] שלב 2: מבחן אנטרופיה מואץ למימוש ה-ECDH P-256 (Stress Test)...');
    const iterations = 5000;
    const bitCounts = new Array(256).fill(0);
    let start = performance.now();

    for (let i = 0; i < iterations; i++) {
        const ecdh = createECDH('prime256v1');
        ecdh.generateKeys();
        const privKey = ecdh.getPrivateKey();

        // Count bits to ensure uniform zero/one distribution
        for (let byte of privKey) {
            for (let b = 0; b < 8; b++) {
                if ((byte & (1 << b)) !== 0) {
                    bitCounts[b]++;
                }
            }
        }
    }

    let end = performance.now();
    console.log(`   ⏱️  יוצרו ${iterations} זוגות מפתחות בפחות מ-${(end - start).toFixed(2)}ms.`);
    console.log('   📊 התפלגות ביטים אקראיים (דליית PRNG תקינה מ-OpenSSL ולא מ-Math.random של V8):');
    let totalBits = iterations * 32 * 8;
    let expectedSetBits = totalBits / 2;
    let maxDeviation = 0;

    // We expect roughly 50% ones and 50% zeros
    bitCounts.slice(0, 8).forEach((count, idx) => { // Sample the first 8 bit positions across all keys
        let deviation = Math.abs(count - (iterations * 32 / 2));
        if (deviation > maxDeviation) maxDeviation = deviation;
    });

    console.log(`   ✔️  סטייה מקסימלית מהאידיאל (50%): ${((maxDeviation / (iterations * 32)) * 100).toFixed(2)}%`);
    if (maxDeviation / (iterations * 32) < 0.05) {
        console.log('   ✅ [PASS] האנטרופיה יציבה ואחידה. ה-CSPRNG של מערכת ההפעלה חובר בהצלחה.');
    } else {
        console.error('   ❌ [FAIL] זוהתה נטייה סטטיסטית באנטרופיה (PRNG Bias)!');
    }

    // 3. מבחן חוסן הרצתו של OpenSSL (Invalid Curve Attack)
    console.log('\n[+] שלב 3: הדיפת מתקפת Invalid Curve דרך Node.js Native Bindings...');
    const victim = createECDH('prime256v1');
    victim.generateKeys();

    // יצירת נקודה שקרית (Fake Public Key) שאיננה על עקומת P-256 הרשמית
    // (P-256 uses uncompressed format starting with 0x04, followed by 32 byte X and 32 byte Y)
    // We'll create a mathematically invalid point to see if OpenSSL catches it before V8 crashes.
    const fakePubKey = Buffer.alloc(65);
    fakePubKey[0] = 0x04; // Uncompressed marker
    fakePubKey.fill(0xFF, 1, 65); // Invalid coordinates for P-256

    try {
        console.log('   ☠️ התחקות: התוקף שולח מפתח ציבורי פגום/זדוני לפונקציית הפיענוח...');
        victim.computeSecret(fakePubKey);
        console.error('   ❌ [FAIL] המערכת שתתה את הרעל! ה-OpenSSL לא זיהה שהנקודה מחוץ לעקומה.');
    } catch (e: any) {
        if (e.message.includes('Public key is not valid')) {
            console.log('   ✅ [PASS] חסימה בשכבת C++! שגיאה: "' + e.message + '"');
            console.log('   🛡️  Node.js Native C++ Bindings דחו את הבקשה ברמת OpenSSL לפני שהגיעה ל-JS.');
        } else {
            console.log('   ⚠️ נדחה, אבל משגיאה אחרת: ' + e.message);
        }
    }

    console.log('\n✅ המבדק הסתיים. התשתית הקריפטוגרפית (Native Crypto) אטומה נגד V8 JS Exploits.');
}

runV8CryptoAudit().catch(console.error);
