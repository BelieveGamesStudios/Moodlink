# Authentication Components

This directory contains all authentication-related components and utilities for Moodlink.

## Components

### Login.jsx
Email/password and magic link authentication form.

**Features:**
- Email/password login
- Magic link (passwordless) login
- Error handling
- Link to signup and guest mode

### Signup.jsx
User registration form.

**Features:**
- Email/password signup
- Optional username
- Password confirmation
- Email verification (handled by Supabase)
- Redirects to home after successful signup

### AuthCallback.jsx
Handles OAuth and magic link callbacks from Supabase.

**Features:**
- Processes authentication callbacks
- Handles errors gracefully
- Redirects to appropriate pages

### ProtectedRoute.jsx
Route wrapper for protecting pages that require authentication.

**Usage:**
```jsx
<Route 
  path="/protected" 
  element={
    <ProtectedRoute requireAuth={true}>
      <YourComponent />
    </ProtectedRoute>
  } 
/>
```

## Authentication Flow

### 1. Sign Up
1. User fills out signup form
2. Supabase creates auth user
3. User profile is created in `users` table
4. Email verification sent (if enabled)
5. User redirected to home

### 2. Sign In
1. User enters email/password OR requests magic link
2. Supabase authenticates
3. User profile loaded from database
4. User redirected to home

### 3. Guest Mode
1. User clicks "Continue as Guest"
2. Guest user profile created (no auth_user_id)
3. Guest user ID stored in localStorage
4. User can use app with limited features
5. Can upgrade to full account later

### 4. Sign Out
1. Supabase session cleared
2. User profile cleared from state
3. Guest user ID cleared from localStorage
4. User redirected to home

## Auth Context

The `AuthContext` provides:
- `user` - Supabase auth user object
- `profile` - User profile from database
- `session` - Current Supabase session
- `loading` - Loading state
- `isGuest` - Whether user is in guest mode
- `signUp(email, password, username)` - Sign up function
- `signIn(email, password)` - Sign in function
- `signInWithMagicLink(email)` - Magic link function
- `signOut()` - Sign out function
- `signInAsGuest()` - Enter guest mode
- `refreshProfile()` - Reload user profile

## Guest User Support

Guest users are stored in the `users` table with:
- `auth_user_id` = `null`
- `preferences.is_guest` = `true`
- Guest user ID stored in `localStorage`

**RLS Policies:**
- Guest users can manage their own records
- Policies check for `auth_user_id IS NULL` for guest access
- Application-level validation ensures guest users only access their own data

## Environment Setup

Make sure your Supabase project has:
1. Email authentication enabled
2. Magic link enabled (optional)
3. RLS policies configured (see migrations)
4. Email templates configured (optional)

## Security Notes

- All passwords are handled by Supabase (never stored in app)
- RLS policies enforce data access at database level
- Guest users have limited access (their own records only)
- Sessions are managed by Supabase Auth
