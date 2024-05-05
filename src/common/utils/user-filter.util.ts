import { Injectable } from '@nestjs/common';

@Injectable()
export class UserFilterUtil {
  filterSensitiveFields(user: any): any {
    const filteredUser = {
      id: user.id,
      status: user.status,
      name: user.name,
      email: user.email,
      is_verified: user.is_verified,
      profile_image_url: user.profile_image_url,
    };

    return filteredUser;
  }
}
