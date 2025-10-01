# Solution Center Setup Guide

This guide explains how to set up the new Solution Center feature with messaging form, Supabase integration, and email notifications.

## Features

- **Solution Center Tab**: Added to main navigation
- **Messaging Form**: Contact form with validation
- **Supabase Integration**: Messages stored in `support_messages` table
- **Email Notifications**: Admin notifications via Nodemailer
- **Bilingual Support**: English/Spanish language toggle

## Setup Instructions

### 1. Database Setup (Supabase)

Run the SQL schema in your Supabase dashboard:

```sql
-- Execute the contents of supabase/support-messages-schema.sql
```

Or use the Supabase CLI:
```bash
supabase db reset
```

### 2. Environment Variables

Add these environment variables to your Netlify site settings:

#### Required Variables:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=admin@claimnavigatorai.com
SITE_URL=https://claimnavigatorai.com
```

#### Gmail Setup (if using Gmail):
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASS`

### 3. File Structure

The following files have been created/modified:

```
├── index.html (modified - added Solution Center nav link)
├── solution-center.html (new - messaging form page)
├── supabase/support-messages-schema.sql (new - database schema)
├── netlify/functions/submit-support-message.js (new - form handler)
├── package.json (modified - added nodemailer dependency)
└── SOLUTION_CENTER_SETUP.md (new - this file)
```

### 4. Database Schema

The `support_messages` table includes:
- `id` (UUID, primary key)
- `user_name` (TEXT, required)
- `user_email` (TEXT, required)
- `subject` (TEXT, required)
- `message` (TEXT, required)
- `status` (TEXT, default: 'new')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 5. Form Validation

Front-end validation includes:
- Name: minimum 2 characters
- Email: valid email format
- Subject: minimum 5 characters
- Message: minimum 10 characters

### 6. Email Notifications

When a message is submitted:
1. Data is saved to Supabase
2. Email notification sent to admin
3. User sees success/error message

### 7. Testing

Test the form by:
1. Navigate to `/solution-center`
2. Fill out the form with test data
3. Submit and verify:
   - Success message appears
   - Email notification received
   - Data appears in Supabase dashboard

### 8. Deployment

After setup:
1. Commit all changes
2. Push to GitHub
3. Netlify will automatically deploy
4. Test on live site

## Troubleshooting

### Common Issues:

1. **Email not sending**: Check SMTP credentials and App Password
2. **Database errors**: Verify Supabase URL and keys
3. **Form validation**: Check browser console for JavaScript errors
4. **CORS issues**: Ensure Netlify function headers are correct

### Debug Steps:

1. Check Netlify function logs
2. Verify environment variables
3. Test Supabase connection
4. Check email service status

## Security Notes

- Form includes CSRF protection via Netlify
- Email validation prevents spam
- Rate limiting recommended for production
- Consider adding CAPTCHA for additional security

## Future Enhancements

Potential improvements:
- Admin dashboard for message management
- Auto-reply emails to users
- Message status tracking
- File attachment support
- Integration with help desk software
