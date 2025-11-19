from django.db import models
from django.contrib.auth.models import User


class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    contact_number = models.CharField(max_length=15, blank=True, null=True)
    designation = models.CharField(max_length=50, blank=True, null=True)
    band = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.employee_id} - {self.first_name} {self.last_name}"

class Itinerary(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
        ("Completed", "Completed"),
        ("Withdrawn", "Withdrawn"),
    ]

    TYPE_CHOICES = [
        ("Domestic", "Domestic"),
        ("International", "International"),
    ]

    MODE_CHOICES = [
        ("Flight", "Flight"),
        ("Train", "Train"),
        ("Bus", "Bus"),
        ("Car", "Car"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="itineraries")
    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="Pending")
    type = models.CharField(max_length=16, choices=TYPE_CHOICES, default="Domestic")
    mode = models.CharField(max_length=16, choices=MODE_CHOICES, default="Flight")
    purpose = models.CharField(max_length=255)
    request_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-request_date", "-created_at"]

    def __str__(self) -> str:
        return f"{self.from_city} → {self.to_city} ({self.start_date} - {self.end_date})"
