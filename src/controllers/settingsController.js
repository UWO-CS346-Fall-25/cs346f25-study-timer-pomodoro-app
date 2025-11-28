const supabase = require('../lib/supabaseClient');
const userStore = require('../models/userStore');

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

    const freshUrl = `${data.publicUrl}?t=${Date.now()}`;

    console.log(
      `[${new Date().toISOString()}] [SettingsController] Avatar upload SUCCESS — updating user record`
    );

    await userStore.updateUser(user.id, { avatar_url: freshUrl });

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
