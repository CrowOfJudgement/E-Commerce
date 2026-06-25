import * as bcrypt from 'bcrypt';

export function Hash({
  plain_text,
  salt_rounds = Number(process.env.SALT_ROUNDS) || 10,
}: {
  plain_text: string;
  salt_rounds?: number;
}): string {
  return bcrypt.hashSync(plain_text.toString(), Number(salt_rounds));
}

export function Compare({
  plain_text,
  cipher_text,
}: {
  plain_text: string;
  cipher_text: string;
}): boolean {
  return bcrypt.compareSync(plain_text, cipher_text);
}
