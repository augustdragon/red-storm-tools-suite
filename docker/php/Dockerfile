##
# Custom PHP 8.1 + Apache image for Red Storm Tools Suite
#
# Extends the official PHP Apache image to add:
#   - PDO MySQL extension (required for database connectivity)
#   - Apache mod_rewrite (required for clean API URLs)
#
# The base image includes Apache configured to serve /var/www/html,
# which we mount to rs-tools-hosted/ via docker-compose volumes.
##

FROM php:8.1-apache

# Install the PDO MySQL extension so PHP can talk to the MySQL container.
# docker-php-ext-install is a helper script included in official PHP images
# that handles compiling and enabling extensions.
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache's mod_rewrite module. This allows .htaccess files to define
# URL rewriting rules — we use this to route /api/* requests to index.php.
RUN a2enmod rewrite

# Allow .htaccess overrides in the web root. By default, Apache ignores
# .htaccess files unless AllowOverride is set.
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf
