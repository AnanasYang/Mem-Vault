/**
 * L4 Layer API
 * /api/l4 - 获取L4核心身份
 */

const dataApi = require('../../../lib/data-api');

export default function handler(req, res) {
  try {
    const core = dataApi.getL4Core();
    res.status(200).json(core);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
