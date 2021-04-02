/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NextApiResponse } from 'next';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async (_, res: NextApiResponse) => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
};
