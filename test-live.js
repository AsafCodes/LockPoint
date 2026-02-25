async function run() {
    try {
        console.log('Logging in as master on LIVE...');
        const loginRes = await fetch('https://lockpoint-alpha.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceNumber: 'master', password: 'LP1234' })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));

        const token = loginData.data.tokens.accessToken;
        console.log('Got token. Fetching zones...');

        const zonesReq = await fetch('https://lockpoint-alpha.onrender.com/api/zones', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const zones = await zonesReq.json();
        console.log('Live Zones:', JSON.stringify(zones, null, 2));

        console.log('Fetching hierarchy to find user...');
        const hierarchyReq = await fetch('https://lockpoint-alpha.onrender.com/api/units/hierarchy', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const hierarchy = await hierarchyReq.json();

        function findUser(node) {
            if (node.soldiers) {
                for (const s of node.soldiers) {
                    if (s.serviceNumber === '4605914' || s.serviceNumber === '5127011') {
                        console.log('Found user:', JSON.stringify(s, null, 2));
                    }
                }
            }
            if (node.children) {
                for (const child of node.children) {
                    findUser(child);
                }
            }
        }

        if (hierarchy.data?.unit) {
            findUser(hierarchy.data.unit);
        } else {
            console.log('No unit hierarchy found', JSON.stringify(hierarchy).substring(0, 100));
        }

    } catch (e) {
        console.error('SCRIPT ERROR:', e);
    }
}
run();
