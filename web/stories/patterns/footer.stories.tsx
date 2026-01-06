import { Footer } from '@/components/footer';
import { Meta } from '@storybook/nextjs-vite';

const FooterStory = () => {
  return <Footer />;
};

const meta: Meta<typeof FooterStory> = {
  title: 'Patterns/Footer',
  component: FooterStory,
};

export default meta;

export const Default = () => <FooterStory />;
