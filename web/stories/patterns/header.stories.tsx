import { Header } from '@/components/header/header';
import { Meta } from '@storybook/nextjs-vite';

const HeaderStory = () => {
  return <Header />;
};

const meta: Meta<typeof HeaderStory> = {
  title: 'Patterns/Header',
  component: HeaderStory,
};

export default meta;

export const Default = () => <HeaderStory />;
