from django.contrib.auth.models import AbstractUser
from django.db import models


ROLE_CHOICES = (
    ('student', 'Student'),
    ('teacher', 'Teacher'),
    ('admin', 'Admin'),
)


class CustomUser(AbstractUser):
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_teacher(self):
        return self.role == 'teacher' or self.is_superuser

    def is_student(self):
        return self.role == 'student'

    def is_admin_user(self):
        return self.role == 'admin' or self.is_superuser

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
