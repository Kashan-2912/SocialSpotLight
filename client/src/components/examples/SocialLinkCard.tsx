import SocialLinkCard from '../SocialLinkCard';

export default function SocialLinkCardExample() {
  return (
    <div className="space-y-4 p-6 max-w-2xl mx-auto">
      <SocialLinkCard
        id="demo-1"
        platform="instagram"
        url="https://instagram.com/alexmorgan"
        displayText="@alexmorgan"
        clickCount={125}
      />
      <SocialLinkCard
        id="demo-2"
        platform="twitter"
        url="https://twitter.com/alexmorgan"
        displayText="@alexmorgan"
        clickCount={89}
      />
      <SocialLinkCard
        id="demo-3"
        platform="github"
        url="https://github.com/alexmorgan"
        displayText="alexmorgan"
        clickCount={42}
        expiresAt={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)}
      />
    </div>
  );
}
