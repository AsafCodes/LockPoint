

async function run() {
    try {
        console.log('Logging in as master...');
        const loginRes = await fetch('https://lockpoint-alpha.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceNumber: 'master', password: 'LP1234' })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));

        const token = loginData.data.tokens.accessToken;
        const unitId = loginData.data.user.unitId;
        console.log('Got token. Unit ID:', unitId);

        const payload = {
            name: 'Test Zone ' + Date.now(),
            shapeType: 'polygon',
            vertices: [
                { lat: 32.0, lng: 34.0 },
                { lat: 32.1, lng: 34.0 },
                { lat: 32.1, lng: 34.1 }
            ],
            centerLat: 32.05,
            centerLng: 34.05,
            isActive: true,
            unitId: unitId
        };

        console.log('Creating zone with payload:', JSON.stringify(payload));

        const req = await fetch('https://lockpoint-alpha.onrender.com/api/zones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });

        const resBody = await req.text();
        console.log('RESPONSE STATUS:', req.status);
        console.log('RESPONSE BODY:', resBody);

    } catch (e) {
        console.error('SCRIPT ERROR:', e);
    }
}
run();
