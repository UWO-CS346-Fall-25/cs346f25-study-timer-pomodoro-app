const supabase = require('../lib/supabaseClient');
const userStore = require('../models/userStore');

exports.updateAvatar = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.json({ success: false, error: 'Not authenticated' });
    }

    const file = req.file;
    if (!file) {
      return res.json({ success: false, error: 'No file uploaded' });
    }

    const ext = file.originalname.split('.').pop();
    const fileName = `${user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.json({ success: false, error: 'Upload failed' });
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

    const freshUrl = `${data.publicUrl}?t=${Date.now()}`;

    await userStore.updateUser(user.id, {
      avatar_url: freshUrl,
    });

    req.session.user.avatarUrl = freshUrl;

    return res.json({ success: true, url: freshUrl });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, error: 'Server error' });
  }
};

exports.removeAvatar = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.redirect('/settings');
    }

    await userStore.updateUser(user.id, {
      avatar_url: null,
    });

    req.session.user.avatarUrl = null;

    return res.redirect('/settings');
  } catch (err) {
    console.error(err);
    return res.redirect('/settings');
  }
};
