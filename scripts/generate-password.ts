import bcrypt from 'bcrypt';

const password = 'SuperAdmin123!'; // Mot de passe pour le super admin
const saltRounds = 10;

const hash = bcrypt.hashSync(password, saltRounds);
console.log('Mot de passe:', password);
console.log('Hash:', hash);
