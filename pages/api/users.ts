import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/mongo';
import User, { IUser } from '../../models/User';

type ResponseData = {
  success: boolean;
  data?: IUser | IUser[];
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { name, email } = req.body;
      const newUser = await User.create({ name, email });
      return res.status(201).json({ success: true, data: newUser });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const users = await User.find({});
      return res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
