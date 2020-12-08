import { newE2EPage } from '@stencil/core/testing';

describe('rf-audio-eq', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<rf-audio-eq></rf-audio-eq>');

    const element = await page.find('rf-audio-eq');
    expect(element).toHaveClass('hydrated');
  });
});
