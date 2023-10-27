import database from "../database";

/** Adds active property on all users */
export default async () => {
  // Get all user
  const result = await database.callList({
    include_docs: true,
    startkey: "user:!",
    endkey: "user:~",
  });

  const users = result.rows.map((r) => r.doc);

  users.forEach((user) => {
    user.active = true;
  });

  // Save users
  await database.callBulk({ docs: users });
};
