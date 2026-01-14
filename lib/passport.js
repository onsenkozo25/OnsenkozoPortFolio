const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback';
const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL || '';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
      },
      (accessToken, refreshToken, profile, done) => {
        const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || '';
        if (!ALLOWED_EMAIL) {
          return done(null, false, { message: 'ALLOWED_EMAIL is not set.' });
        }
        if (email.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
          return done(null, false, { message: 'Not allowed.' });
        }
        return done(null, { id: profile.id, email });
      }
    )
  );
} else {
  console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL.');
}

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/auth/google');
}

module.exports = {
  ensureAuth
};
