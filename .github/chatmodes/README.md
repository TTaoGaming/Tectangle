# Chatmodes policy

This repository treats chatmodes as managed configuration. Automated agents should not create or edit files in this folder unless explicitly requested.

How to allow a commit that touches chatmodes:

- Temporarily set the environment variable ALLOW_CHATMODE_EDITS=1 for the commit, or
- Include the token [allow-chatmodes] in the commit message.

Husky will block commits that modify `.github/chatmodes/**` without one of the above.

If an unintended file was created here, delete it and commit again with the guard in place.
