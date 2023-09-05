// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { test, expect } from '@playwright/test';

/**
 * Test case: Visitors should be able to sign in to existing accounts.
 */
test('should be able to sign in to an account using a password', async ({ context, page }) => {
    await page.goto('/');

    // (1) Confirm that no cookies currently exists, i.e. the user is signed out.
    await expect(await context.cookies()).toHaveLength(0);

    // (2) Click on the "Sign in" button.
    await page.getByText('Sign in').click();

    // (3) Wait for the dialog to be loaded, enter the testing username and submit the form.
    await page.getByText('Please enter your e-mail address').waitFor();
    await page.getByLabel('E-mail').fill('playwright@animecon.nl');
    await page.getByRole('button', { name: 'Proceed' }).click();

    // (4) Wait for the user to be asked to enter their password, enter the wrong one and submit.
    await page.getByText('Please enter your password').waitFor();
    await page.getByLabel('Password').fill('not-my-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // (5) Wait for the error to be acknowledged. Now enter the right password and submit again.
    await page.getByText('That is not the password we\'ve got on file. Try again?').waitFor();
    await page.getByLabel('Password').fill('playwright');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // (6) Confirm that the user has signed in and the page refreshed with their identity.
    await page.getByText('PWUSER').waitFor();

    // (7) Confirm that an 'auth' cookie has been set, i.e. the user's session information.
    const cookies = await context.cookies();
    expect(cookies).toHaveLength(1);
    expect(cookies[0].name).toEqual('auth');
    expect(cookies[0].value).toMatch(/^Fe/);  // prefix for Iron
});

/**
 * Test case: Visitors should have to update their password when signing in with an access code.
 */
test('should be able to sign in to an account using an access code', async ({ context, page }) => {
    await page.goto('/');

    // (1) Confirm that no cookies currently exists, i.e. the user is signed out.
    await expect(await context.cookies()).toHaveLength(0);

    // (2) Click on the "Sign in" button.
    await page.getByText('Sign in').click();

    // (3) Wait for the dialog to be loaded, enter the testing username and submit the form.
    await page.getByText('Please enter your e-mail address').waitFor();
    await page.getByLabel('E-mail').fill('playwright-access-code@animecon.nl');
    await page.getByRole('button', { name: 'Proceed' }).click();

    // (4) Wait for the user to be asked to enter their password, enter the access code and submit.
    await page.getByText('Please enter your password').waitFor();
    await page.getByLabel('Password').fill('8765');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // (5) Wait for the user to be asked to update their password, confirm no cookies were set.
    await page.getByText('Update your password').waitFor();
    await expect(await context.cookies()).toHaveLength(0);

    // (6) Enter the updated password and submit the form.
    await page.getByLabel('New password').fill(/* random.org= */ 'bQpwasV$RB5zVzpU');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // (7) Confirm that the user has signed in, the page refreshed and that a cookie was set.
    await page.getByText('PWUSER').waitFor();
    await expect(await context.cookies()).toHaveLength(1);
});

/**
 * Test case: Visitors should not be able to sign in to unactivated accounts.
 */
test('should not be able to sign in to unactivated accounts', async ({ context, page }) => {
    await page.goto('/');

    // (1) Click on the "Sign in" button.
    await page.getByText('Sign in').click();

    // (2) Wait for the dialog to be loaded, enter the testing username and submit the form.
    await page.getByText('Please enter your e-mail address').waitFor();
    await page.getByLabel('E-mail').fill('playwright-unactivated@animecon.nl');
    await page.getByRole('button', { name: 'Proceed' }).click();

    // (3) Confirm that a dialog has been shown telling the user to activate.
    await page.getByText('Activate your account').waitFor();

    // (4) Confirm that no cookies were written for the user.
    await expect(await context.cookies()).toHaveLength(0);
});

/**
 * Test case: Visitors should be able to register and create new accounts.
 */
// TODO

/**
 * Test case: Visitors should be able to recover their passwords.
 */
// TODO
