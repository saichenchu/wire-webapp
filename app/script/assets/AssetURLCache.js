/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */


'use strict';

window.z = window.z || {};
window.z.assets = z.assets || {};

z.assets.AssetURLCache = (function() {
  const lru_cache = new LRUCache(100);

  const set_url = function(identifier, url) {
    const existing_url = get_url(identifier);

    if (existing_url) {
      window.URL.revokeObjectURL(url);
      return existing_url;
    }

    const outdated_url = lru_cache.set(identifier, url);

    if (outdated_url != null) {
      window.URL.revokeObjectURL(outdated_url);
    }

    return url;
  };

  const get_url = identifier => lru_cache.get(identifier);

  return {
    get_url,
    set_url,
  };
})();
