/**
 * L0 Layer API - Dates Endpoint
 * /api/l0/dates - 获取可用日期列表
 */

const dataApi = require('../../../lib/data-api');

export default function handler(req, res) {
  try {
    const dates = dataApi.getL0Dates();
    res.status(200).json(dates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
