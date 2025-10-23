# travel_itinerary/management/commands/create_users.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from travel_itinerary.models import Employee

class Command(BaseCommand):
    help = 'Create auth.User accounts for all employees'

    def handle(self, *args, **kwargs):
        employees = Employee.objects.all()
        created_count = 0
        skipped_count = 0

        for emp in employees:
            # username = lowercase first + last name, no spaces
            username = (emp.first_name + emp.last_name).lower()
            # password = First letter uppercase + rest lowercase + @123
            password = emp.first_name.capitalize() + '@123'

            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    first_name=emp.first_name,
                    last_name=emp.last_name,
                    email=emp.email or ''
                )
                self.stdout.write(self.style.SUCCESS(f'Created user: {username}'))
                created_count += 1
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {username}'))
                skipped_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done! Created {created_count} users, skipped {skipped_count}.'
        ))
