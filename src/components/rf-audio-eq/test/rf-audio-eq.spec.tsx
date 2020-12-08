import { newSpecPage } from '@stencil/core/testing';
import { RfAudioEq } from '../rf-audio-eq';

describe('rf-audio-eq', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [RfAudioEq],
      html: `<rf-audio-eq></rf-audio-eq>`,
    });
    expect(page.root).toEqualHtml(`
      <rf-audio-eq>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </rf-audio-eq>
    `);
  });
});
