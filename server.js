const express = require('express');
const app = express();
const PORT = 3000;

// Variables to temporarily hold tokens in memory for testing
let accessToken = "";
let refreshToken = "";

// Paste your Spotify credentials here
const CLIENT_ID = 'ee8a0fad6e434cbcaf2fbedf1027003f';
const CLIENT_SECRET = '5e3de984620a4b0691955eb807f0a0d4'; // Put your real hidden secret back here!
const REDIRECT_URI = 'http://127.0.0.1:3000/callback';

// 1. ROUTE: Link your Spotify account by visiting this in your browser
app.get('/login', (req, res) => {
    const scopes = 'user-read-currently-playing user-read-playback-state';
    // FIXED: Changed to real Spotify Authorize endpoint
    res.redirect('https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + CLIENT_ID +
        '&scope=' + encodeURIComponent(scopes) +
        '&redirect_uri=' + encodeURIComponent(REDIRECT_URI));
});

// 2. ROUTE: Spotify redirects here with an authorization code
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    
    // FIXED: Changed to real Spotify Token endpoint
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            code: code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        })
    });

    const data = await response.json();
    accessToken = data.access_token;
    refreshToken = data.refresh_token;

    res.send('<h1>Authenticated! You can close this tab and open Roblox Studio now.</h1>');
});

// 3. ROUTE: The endpoint Roblox will call
app.get('/current-song', async (req, res) => {
    if (!accessToken) {
        return res.json({ isPlaying: false, error: "Not logged into Spotify yet." });
    }

    try {
        // FIXED: Changed to real Spotify Player API endpoint
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.status === 200) {
            const data = await response.json();
            if (data.is_playing && data.item) {
                return res.json({
                    isPlaying: true,
                    song: data.item.name,
                    artist: data.item.artists[0].name
                });
            }
        }
        res.json({ isPlaying: false });
    } catch (err) {
        res.json({ isPlaying: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Local server running at http://127.0.0.1:${PORT}`);
    console.log(`👉 FIRST: Go to http://127.0.0.1:${PORT}/login to link your Spotify!`);
});