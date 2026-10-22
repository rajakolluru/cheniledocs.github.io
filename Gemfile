source "https://rubygems.org"

# Plain modern Jekyll for local builds. Uses rouge (not pygments.rb), so it
# avoids the old posix-spawn native extension that fails to build on current macOS.
gem "jekyll", "~> 4.3"

# If you need the exact GitHub Pages build chain instead, comment the line above
# and use:  gem "github-pages", group: :jekyll_plugins
# (requires a Ruby version inside github-pages' supported range).

group :jekyll_plugins do
  gem "jekyll-feed"
end

gem "webrick", "~> 1.8"
