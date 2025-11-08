import ProfileHeader from '../ProfileHeader';
import avatarImage from '@assets/generated_images/Modern_gradient_avatar_placeholder_b1b9caec.png';

export default function ProfileHeaderExample() {
  return (
    <ProfileHeader
      name="Alex Morgan"
      bio="Creative designer & developer passionate about building beautiful digital experiences ✨"
      avatarUrl={avatarImage}
    />
  );
}
