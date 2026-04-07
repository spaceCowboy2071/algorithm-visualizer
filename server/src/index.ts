import 'dotenv/config';

import app from './app';
import { testConnection } from './db';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  testConnection();
});
