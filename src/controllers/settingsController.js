/**
 * Settings Controller
 *
 * Handles profile settings actions such as uploading or removing a user's
 * avatar. All logic interacts with Supabase Storage and updates the user's
 * database record accordingly.
 */

const supabase = require('../lib/supabaseClient');
const userStore = require('../models/userStore');

/**
 * Controller: updateAvatar
 * Purpose:
 *    Upload a new profile picture to Supabase Storage, update the user's avatar
 *    URL in the DB, and refresh the session to use the updated URL.
 *
 * Input:
 *    - req.file: Uploaded image buffer, mimetype, filename (provided by multer)
 *    - req.session.user: Current logged-in user object
 *
 * Output:
 *    - JSON response:
 *         { success: true, url: <freshUrl> }
 *         { success: false, error: <reason> }
 *
 * Edge Cases:
 *    - No authenticated user → return JSON error
 *    - No file uploaded → return JSON error
 *    - Supabase upload fails → return JSON error
 *    - Cache-busting query param (?t=timestamp) ensures browser fetches new image
 */
exports.updateAvatar = async (req, res) => {
  console.log(
    `[${new Date().toISOString()}] [SettingsController] updateAvatar START`
  );

  try {
    const user = req.session.user;
    if (!user) {
      console.warn(
        `[${new Date().toISOString()}] [SettingsController] updateAvatar FAILED — not authenticated`
      );
      return res.json({ success: false, error: 'Not authenticated' });
    }

    const file = req.file;
    console.log(
      `[${new Date().toISOString()}] [SettingsController] Received file: ${
        file?.originalname || 'NONE'
      }`
    );

    if (!file) {
      console.warn(
        `[${new Date().toISOString()}] [SettingsController] No file uploaded`
      );
      return res.json({ success: false, error: 'No file uploaded' });
    }

    const ext = file.originalname.split('.').pop();
    const fileName = `${user.id}.${ext}`;

    console.log(
      `[${new Date().toISOString()}] [SettingsController] Uploading avatar to Supabase: ${fileName}`
    );

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error(
        `[${new Date().toISOString()}] [SettingsController] Upload ERROR:`,
        uploadError.message
      );
      return res.json({ success: false, error: 'Upload failed' });
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

    // Cache-busting ensures browser loads fresh image instead of cached old ones
    const freshUrl = `${data.publicUrl}?t=${Date.now()}`;

    console.log(
      `[${new Date().toISOString()}] [SettingsController] Avatar upload SUCCESS — updating user record`
    );

    await userStore.updateUser(user.id, { avatar_url: freshUrl });

    // Update session so page reflects new avatar immediately
    req.session.user.avatarUrl = freshUrl;

    console.log(
      `[${new Date().toISOString()}] [SettingsController] updateAvatar SUCCESS`
    );
    return res.json({ success: true, url: freshUrl });
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [SettingsController] updateAvatar ERROR:`,
      err.message
    );
    return res.json({ success: false, error: 'Server error' });
  }
};

/**
 * Controller: removeAvatar
 * Purpose:
 *    Remove the user's avatar by clearing the avatar_url column in the DB.
 *    Does *not* delete the file from Supabase Storage, only detaches it from
 *    the user's account.
 *
 * Input:
 *    - req.session.user: Current logged-in user
 *
 * Output:
 *    - Redirects back to /settings
 *
 * Edge Cases:
 *    - If user not authenticated → redirect back without changes
 */
exports.removeAvatar = async (req, res) => {
  console.log(
    `[${new Date().toISOString()}] [SettingsController] removeAvatar START`
  );
  try {
    const user = req.session.user;
    if (!user) {
      console.warn(
        `[${new Date().toISOString()}] [SettingsController] removeAvatar FAILED — not authenticated`
      );
      return res.redirect('/settings');
    }

    console.log(
      `[${new Date().toISOString()}] [SettingsController] Removing avatar for ${user.id}`
    );

    await userStore.updateUser(user.id, { avatar_url: null });
    req.session.user.avatarUrl = null;

    console.log(
      `[${new Date().toISOString()}] [SettingsController] removeAvatar SUCCESS`
    );
    return res.redirect('/settings');
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [SettingsController] removeAvatar ERROR:`,
      err.message
    );
    return res.redirect('/settings');
  }
};
