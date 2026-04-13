import { hash } from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run admin:hash -- <password>");
  process.exit(1);
}

const passwordHash = await hash(password, 12);
console.log(passwordHash);
