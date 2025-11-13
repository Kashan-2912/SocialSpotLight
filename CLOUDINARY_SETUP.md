# Cloudinary Image Upload Setup

## What Changed

Profile images are now stored on Cloudinary CDN instead of as base64 strings in the database. This provides:

- ⚡ **Faster loading** - Images served from global CDN
- 🗜️ **Automatic optimization** - WebP format, compression, resizing
- 💾 **Smaller database** - Only stores URLs instead of huge base64 strings
- 🎯 **Smart cropping** - Face detection for better profile pictures
- 🆓 **Free tier** - 25GB storage, 25GB bandwidth/month

## How It Works

### Upload Flow
1. User selects image in profile editor
2. Frontend converts image to base64
3. Sends to `/api/upload-image` endpoint
4. Backend uploads to Cloudinary with optimizations:
   - Resized to 400x400
   - Face-detection cropping
   - Auto quality & format (WebP)
5. Cloudinary returns secure URL
6. URL saved to database (not the image data)

### File Structure
- **Backend Route**: `server/upload-routes.ts`
- **Frontend Component**: `client/src/components/ProfileEditDialog.tsx`
- **Config**: `.env` (lines 14-19)

## Configuration

Your Cloudinary credentials are already configured in `.env`:
```env
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
```

## Usage

### For Users
1. Click "Edit Profile" button
2. Click "Upload Image"
3. Select image (max 5MB)
4. Image automatically uploads to Cloudinary
5. Click "Save Changes"

### For Developers
```typescript
// Upload image
const response = await fetch('/api/upload-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: base64DataUrl  // "data:image/png;base64,..."
  })
});

const { url, publicId } = await response.json();
// url: "https://res.cloudinary.com/root/image/upload/..."

// Save URL to profile
await updateProfile({ avatarUrl: url });
```

## Migrating Old Data

If you have existing profiles with base64 avatars, they will still work but won't get the optimization benefits. To migrate:

1. Query profiles with base64 avatarUrls (starts with "data:image")
2. Upload each to Cloudinary via `/api/upload-image`
3. Update profile with new URL

## API Endpoints

### POST /api/upload-image
Uploads image to Cloudinary

**Request:**
```json
{
  "image": "data:image/png;base64,iVBORw0KG..."
}
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/root/image/upload/v1234/social-spotlight/avatars/abc123.jpg",
  "publicId": "social-spotlight/avatars/abc123"
}
```

### DELETE /api/delete-image
Deletes image from Cloudinary (optional cleanup)

**Request:**
```json
{
  "publicId": "social-spotlight/avatars/abc123"
}
```

## Troubleshooting

### "Cloudinary not configured" error
- Check `.env` file has all three Cloudinary variables
- Restart dev server after changing `.env`

### Upload fails with 413 error
- Image is too large (max 5MB)
- Or Express body limit needs increase (already set to 50MB)

### Images don't load
- Check Cloudinary URL is valid (starts with https://res.cloudinary.com/)
- Verify Cloudinary account is active
- Check browser console for CORS errors

## Cloudinary Dashboard

View uploaded images: https://console.cloudinary.com/console/media_library

Here you can:
- View all uploaded images
- See storage usage
- Delete old images
- Configure transformations
- Monitor bandwidth usage
