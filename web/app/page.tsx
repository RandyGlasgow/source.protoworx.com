import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BotIcon, SearchIcon, Share2Icon, WrenchIcon } from 'lucide-react';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Discover and Share LLM Resources
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl text-lg sm:text-xl">
          Source is your platform for searching, discovering, and sharing the
          best LLM prompts, tools, and agents. Build faster with the power of
          community-driven resources.
        </p>
        <div className="flex gap-4">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">
            Explore
          </Button>
        </div>
      </section>

      {/* What is Source Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">What is Source?</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Source is a comprehensive platform designed to help developers,
              researchers, and AI enthusiasts find and share high-quality LLM
              resources. Whether you&apos;re looking for the perfect prompt, a
              powerful tool, or a reliable agent, Source makes it easy to
              discover what you need and contribute to the community.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">
          What You Can Find
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <SearchIcon className="text-primary h-6 w-6" />
              </div>
              <CardTitle>Prompts</CardTitle>
              <CardDescription>
                Discover expertly crafted prompts that help you get the most out
                of your LLM interactions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <WrenchIcon className="text-primary h-6 w-6" />
              </div>
              <CardTitle>Tools</CardTitle>
              <CardDescription>
                Find powerful tools and utilities that enhance your LLM workflow
                and productivity.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BotIcon className="text-primary h-6 w-6" />
              </div>
              <CardTitle>Agents</CardTitle>
              <CardDescription>
                Explore intelligent agents and assistants that can automate
                complex tasks and workflows.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Share2Icon className="text-primary h-6 w-6" />
              </div>
              <CardTitle>Sharing</CardTitle>
              <CardDescription>
                Share your own discoveries and creations with the community to
                help others succeed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join the community and start discovering amazing LLM resources
            today.
          </p>
          <Button size="lg">Sign Up Now</Button>
        </div>
      </section>
    </main>
  );
}
