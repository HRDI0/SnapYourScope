import os
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ApiManager:
    def __init__(self):
        self.pagespeed_keys = self._load_keys("PAGESPEED_KEYS")
        self.rich_results_keys = self._load_keys("RICH_RESULTS_KEYS")
        self.current_pagespeed_index = 0
        self.current_rich_results_index = 0

    def _load_keys(self, env_var):
        """Load keys from .env and split by comma."""
        keys_str = os.getenv(env_var, "")
        if not keys_str:
            return []
        return [k.strip() for k in keys_str.split(',') if k.strip()]

    def get_pagespeed_key(self):
        """Get the current PageSpeed API key."""
        if not self.pagespeed_keys:
            return None
        return self.pagespeed_keys[self.current_pagespeed_index]

    def get_rich_results_key(self):
        """Get the current Rich Results API key."""
        if not self.rich_results_keys:
            return None
        return self.rich_results_keys[self.current_rich_results_index]

    def rotate_pagespeed_key(self):
        """Switch to the next PageSpeed key."""
        if not self.pagespeed_keys:
            return False
        
        prev_index = self.current_pagespeed_index
        self.current_pagespeed_index = (self.current_pagespeed_index + 1) % len(self.pagespeed_keys)
        
        print(f"🔄 Rotating PageSpeed Key: {prev_index} -> {self.current_pagespeed_index}")
        return True

    def rotate_rich_results_key(self):
        """Switch to the next Rich Results key."""
        if not self.rich_results_keys:
            return False
            
        prev_index = self.current_rich_results_index
        self.current_rich_results_index = (self.current_rich_results_index + 1) % len(self.rich_results_keys)
        
        print(f"🔄 Rotating Rich Results Key: {prev_index} -> {self.current_rich_results_index}")
        return True

    def get_proxy(self):
        """Get a proxy from the list (if configured)."""
        # Placeholder for proxy logic (Bright Data / Smartproxy)
        # In a real scenario, this would load from PROXY_LIST env var
        proxies_str = os.getenv("PROXY_LIST", "")
        if not proxies_str:
            return None
        proxies = [p.strip() for p in proxies_str.split(',') if p.strip()]
        return random.choice(proxies)

# Example Usage
if __name__ == "__main__":
    manager = ApiManager()
    print(f"PS Key 1: {manager.get_pagespeed_key()}")
    manager.rotate_pagespeed_key()
    print(f"PS Key 2: {manager.get_pagespeed_key()}")
