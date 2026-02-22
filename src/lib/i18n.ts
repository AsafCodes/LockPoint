// ─────────────────────────────────────────────────────────────
// LockPoint — Hebrew-First Internationalization
// ─────────────────────────────────────────────────────────────

export const t = {
    // ── App ──────────────────────────────────────────────
    app: {
        name: 'לוקפוינט',
        subtitle: 'מערכת נוכחות',
        tagline: 'מערכת נוכחות צבאית',
        active: 'לוקפוינט פעיל',
    },

    // ── Auth ─────────────────────────────────────────────
    auth: {
        serviceNumber: 'מספר אישי',
        password: 'סיסמה',
        signIn: 'התחברות',
        signOut: 'יציאה',
        authenticating: 'מאמת...',
        quickDemo: 'גישה מהירה לדמו',
        invalidCredentials: 'מספר אישי או סיסמה שגויים.',
        demoFailed: 'התחברות דמו נכשלה.',
        placeholder: {
            serviceNumber: 'לדוגמה S-001',
            password: '••••••••',
        },
    },

    // ── Roles ────────────────────────────────────────────
    roles: {
        soldier: 'חייל',
        commander: 'מפקד',
        senior_commander: 'מפקד בכיר',
    },

    // ── Navigation (Bottom Tabs) ─────────────────────────
    nav: {
        myStatus: 'הסטטוס שלי',
        dashboard: 'לוח מחוונים',
        overview: 'סקירה כללית',
        geofence: 'ניהול גדרות',
        navigation: 'ניווט',
    },

    // ── Status ───────────────────────────────────────────
    status: {
        in_base: 'בבסיס',
        out_of_base: 'בחוץ',
        unknown: 'לא ידוע',
        live: 'שידור חי',
        active: 'פעיל',
        inactive: 'לא פעיל',
    },

    // ── Soldier View ─────────────────────────────────────
    soldier: {
        myStatus: 'הסטטוס שלי',
        trackingFor: 'מעקב נוכחות עבור',
        position: 'מיקום',
        lastUpdate: 'עדכון אחרון',
        activeZone: 'אזור פעיל',
        zone: 'אזור',
        radius: 'רדיוס',
        gpsAccuracy: 'דיוק GPS',
        devControls: 'פקדי פיתוח',
        simulateExit: 'סימולציית יציאה',
        simulateEnter: 'סימולציית כניסה',
    },

    // ── Commander View ───────────────────────────────────
    commander: {
        title: 'לוח מפקד',
        subtitle: 'סקירת נוכחות יחידה בזמן אמת',
        unitStructure: 'מבנה יחידה',
        personnel: 'כוח אדם',
        showAll: '(הצג הכל)',
        recentEvents: 'אירועים אחרונים',
    },

    // ── Senior Commander View ────────────────────────────
    senior: {
        title: 'סקירה כללית',
        subtitle: 'פיקוד צפון — כל היחידות',
        commandStructure: 'מבנה פיקודי',
        unitReadiness: 'כשירות יחידות',
        totalForce: 'סה"כ כוח',
        inBase: 'בבסיס',
        out: 'בחוץ',
        unknownCount: 'לא ידוע',
        readiness: 'כשירות',
    },

    // ── Geofence Management ──────────────────────────────
    geofenceMgmt: {
        title: 'ניהול גדרות גיאוגרפיות',
        subtitle: 'הגדרה וניטור אזורי גדר',
        createZone: '+ צור אזור',
        configuredZones: 'אזורים מוגדרים',
        zoneName: 'שם אזור',
        type: 'סוג',
        radiusM: 'רדיוס (מ\')',
        coordinates: 'קואורדינטות',
        actions: 'פעולות',
        edit: 'עריכה',
        delete: 'מחיקה',
        mapTitle: 'מפת גדרות אינטראקטיבית',
        mapSubtitle: 'מפת Leaflet עם שכבות אזורים ניתנות לעריכה',
    },

    // ── Geofence Overlay (Breach) ────────────────────────
    breach: {
        title: 'שם לב, יש לדווח שבצק',
        exitedPerimeter: 'יצאת ממתחם',
        mustReport: 'עליך לדווח על יעדך לפני שתמשיך.',
        reportWhereBtn: 'דווח',
        dismiss: 'ביטול (חוזר לבסיס)',
        detectedAt: 'חריגה זוהתה ב-',
    },

    // ── Exit Form ────────────────────────────────────────
    exitForm: {
        title: 'דוח יציאה',
        destination: 'יעד',
        destinationPlaceholder: 'לאן אתה הולך?',
        reason: 'סיבה',
        estimatedReturn: 'שעת חזרה משוערת',
        additionalNotes: 'הערות נוספות',
        optional: '(אופציונלי)',
        notesPlaceholder: 'פרטים נוספים...',
        cancel: 'ביטול',
        submit: 'שלח דוח',
    },

    // ── Exit Reasons ─────────────────────────────────────
    reasons: {
        personal_leave: 'חופשה אישית',
        medical: 'רפואי',
        official_duty: 'משימה רשמית',
        training: 'אימון',
        emergency: 'חירום',
        other: 'אחר',
    },

    // ── Table Headers ────────────────────────────────────
    table: {
        unit: 'יחידה',
        total: 'סה"כ',
        inBase: 'בבסיס',
        out: 'בחוץ',
        readiness: 'כשירות',
        noData: 'אין נתונים להצגה',
    },

    // ── Soldier Card ─────────────────────────────────────
    soldierCard: {
        lastUpdate: 'עדכון אחרון',
        position: 'מיקום',
        sn: 'מ"א:',
    },

    // ── Relative Time ────────────────────────────────────
    time: {
        secondsAgo: (n: number) => `לפני ${n} שנ'`,
        minutesAgo: (n: number) => `לפני ${n} דק'`,
        hoursAgo: (n: number) => `לפני ${n} שע'`,
        daysAgo: (n: number) => `לפני ${n} ימים`,
    },
} as const;
