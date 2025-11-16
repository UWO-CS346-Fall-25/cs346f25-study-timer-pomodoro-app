function wantsJson(req) {
  if (!req) return false;
  if (req.get('x-requested-with') === 'fetch') {
    return true;
  }
  const accepts = req.headers.accept || '';
  if (accepts.includes('application/json')) {
    return true;
  }
  const contentType = req.headers['content-type'] || '';
  return contentType.includes('application/json');
}

module.exports = {
  wantsJson,
};
