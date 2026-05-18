import secrets
import string
from django.db import models
from accounts.models import CustomUser


EQUATION_TYPES = (
    ('linear', 'Linear'),
    ('quadratic', 'Quadratic'),
    ('cubic', 'Cubic'),
    ('trigonometric', 'Trigonometric'),
    ('derivative', 'Derivative'),
    ('integral', 'Integral'),
    ('geometry', 'Geometry'),
    ('custom', 'Custom'),
)

BANNER_COLORS = [
    '#6c63ff', '#ff6b6b', '#4ecdc4', '#ffd93d',
    '#ff9f43', '#a29bfe', '#fd79a8', '#00b894',
]


def generate_join_code():
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(secrets.choice(chars) for _ in range(7))
        if not Classroom.objects.filter(join_code=code).exists():
            return code


class Classroom(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    subject = models.CharField(max_length=100, blank=True)
    teacher = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='taught_classes'
    )
    join_code = models.CharField(max_length=10, unique=True)
    banner_color = models.CharField(max_length=7, default='#6c63ff')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.join_code:
            self.join_code = generate_join_code()
        super().save(*args, **kwargs)

    def get_member_count(self):
        return self.memberships.count()

    def get_equation_count(self):
        return self.equations.count()

    def is_member(self, user):
        if not user.is_authenticated:
            return False
        return self.memberships.filter(student=user).exists()

    def __str__(self):
        return f"{self.name} ({self.teacher.username})"


class ClassMembership(models.Model):
    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name='memberships'
    )
    student = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='class_memberships'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('classroom', 'student')
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.student.username} in {self.classroom.name}"


class Equation(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='equations')
    classroom = models.ForeignKey(
        Classroom, on_delete=models.SET_NULL, null=True, blank=True, related_name='equations'
    )
    title = models.CharField(max_length=200)
    equation_type = models.CharField(max_length=20, choices=EQUATION_TYPES, default='custom')
    expression = models.TextField()
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} by {self.user.username}"


class Parameter(models.Model):
    equation = models.ForeignKey(Equation, on_delete=models.CASCADE, related_name='parameters')
    name = models.CharField(max_length=10)
    label = models.CharField(max_length=50)
    min_value = models.FloatField(default=-10.0)
    max_value = models.FloatField(default=10.0)
    default_value = models.FloatField(default=1.0)
    step = models.FloatField(default=0.1)

    def __str__(self):
        return f"{self.name} for {self.equation.title}"


class UsageLog(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='usage_logs'
    )
    action = models.CharField(max_length=100)
    equation_type = models.CharField(max_length=20, blank=True)
    expression = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} at {self.timestamp}"
