// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { syncScrypt } from 'scrypt-js';
import { default as simpleSHA256 } from 'simple-sha256';

/**
 * Securely hashes the given |sha256Password|, considering the application's salt, so that it's
 * safe to store at rest. This function accepts a sha256 hash of the password rather than the real
 * password as the client should never send us a plaintext password in either case.
 *
 * Based on OWASP recommendations, scrypt is used to hash the passwords:
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 *
 * @param sha256Password SHA256 hash of the password.
 * @return A promise that will be returned once the password has been hashed.
 */
export function securePasswordHash(sha256Password: string): string {
    if (!Object.hasOwn(process.env, 'APP_PASSWORD_SALT'))
        throw new Error('A salt must be known to the application in order for hashing to work.');

    return securePasswordHashWithSalt(sha256Password, process.env.APP_PASSWORD_SALT);
}

/**
 * Securely hashes the given |sha256Password| considering the given |salt|.
 *
 * @param sha256Password SHA256 hash of the password.
 * @param salt The salt that should be considered when hashing the password.
 * @return A promise that will be returned once the password has been hashed.
 */
export function securePasswordHashWithSalt(sha256Password: string, salt: string): string {
    if (sha256Password.length !== /* length of a sha256 encoded string= */ 64)
        throw new Error('The given password must be a SHA256 hash already.');

    // TODO...
    return '';
}

/**
 * Creates a SHA256 hash of the given |password|. This uses the `simple-sha256` library that is
 * available both for server and client usage.
 *
 * @param password The password that should be hashed.
 * @return A string containing the SHA256 hash of the password.
 */
export function sha256(password: string): string {
    return simpleSHA256(password);
}
