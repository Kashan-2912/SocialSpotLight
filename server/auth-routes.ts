import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, profiles } from '@shared/schema';

const router = Router();

// Extend session type to include userId
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Sign up
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
    }).returning();

    // Create profile for the user
    const [newProfile] = await db.insert(profiles).values({
      id: newUser.id, // Use user ID as profile ID
      name: username,
      bio: `Welcome to ${username}'s link-in-bio page!`,
      avatarUrl: null,
    }).returning();

    // Set session
    req.session.userId = newUser.id;

    res.status(201).json({
      user: {
        id: newUser.id,
        username: newUser.username,
      },
      profile: newProfile,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Sign in
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Get user's profile
    const [profile] = await db.select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    // Set session
    req.session.userId = user.id;

    res.json({
      user: {
        id: user.id,
        username: user.username,
      },
      profile,
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Sign out
router.post('/signout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to sign out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Signed out successfully' });
  });
});

// Check authentication status
router.get('/me', async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [user] = await db.select({
      id: users.id,
      username: users.username,
    })
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user's profile
    const [profile] = await db.select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    res.json({ user, profile });
  } catch (error: any) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Failed to check authentication' });
  }
});

export default router;
