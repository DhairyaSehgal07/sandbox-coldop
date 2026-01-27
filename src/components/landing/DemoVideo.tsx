import { memo } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

interface DemoVideoProps {
  eyebrow: string;
  title: string;
  description: string;
  videoId: string;
  videoTitle: string;
  detailsTitle: string;
  detailsDescription: string;
  ctaText: string;
  ctaHref: string;
}

const DemoVideo = ({
  eyebrow,
  title,
  description,
  videoId,
  videoTitle,
  detailsTitle,
  detailsDescription,
  ctaText,
  ctaHref,
}: DemoVideoProps) => {
  return (
    <section
      id="demo"
      className="relative w-full overflow-hidden bg-gradient-to-b from-background via-secondary/30 to-background py-20 sm:py-32"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50" />

      <div className="relative mx-auto max-w-[75rem] px-8 sm:px-16 lg:px-24">
        {/* Header */}
        <div className="mb-16 text-center sm:mb-20">
          <span className="font-custom mb-6 block text-base font-medium uppercase tracking-[0.075rem] text-foreground">
            {eyebrow}
          </span>
          <h2 className="font-custom mb-8 text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
            {title}
          </h2>
          <p className="font-custom mx-auto max-w-[50rem] text-lg leading-[1.8] text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Video */}
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-[11px] bg-card shadow-2xl">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={videoTitle}
                className="h-full w-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          {/* Video details */}
          <div className="mt-12 text-center">
            <h3 className="font-custom mb-4 text-2xl font-semibold text-foreground">
              {detailsTitle}
            </h3>
            <p className="font-custom mx-auto max-w-2xl leading-relaxed text-muted-foreground">
              {detailsDescription}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center sm:mt-20">
          <Button
            variant="default"
            size="lg"
            asChild
            className="font-custom px-8 py-4 text-xl shadow-lg"
          >
            <Link to={ctaHref as '/'}>{ctaText}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default memo(DemoVideo);
