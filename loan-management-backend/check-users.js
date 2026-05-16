const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function check() {
  const users = await User.findAll();
  console.log('Total users:', users.length);
  for (const user of users) {
    const isMatch = await bcrypt.compare('Admin@12345', user.passwordHash);
    const isMatchOff = await bcrypt.compare('Officer@12345', user.passwordHash);
    const isMatchJohn = await bcrypt.compare('Password123!', user.passwordHash);
    console.log(`User: ${user.email}, Role: ${user.role}, PassMatchAdmin: ${isMatch}, PassMatchOff: ${isMatchOff}, PassMatchJohn: ${isMatchJohn}`);
  }
  process.exit(0);
}
check();
