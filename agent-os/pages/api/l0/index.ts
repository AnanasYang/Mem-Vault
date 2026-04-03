/**
 * L0 Layer API Routes
 * /api/l0 - 获取指定日期的L0消息
 * /api/l0/dates - 获取可用日期列表
 * /api/l0/stats - 获取L0统计信息
 */

const dataApi = require('../../../lib/data-api');

export default function handler(req, res) {
  const { date } = req.query;
  
  try {
    const messages = dataApi.getL0ByDate(date);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
