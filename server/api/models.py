from django.db import models
from django.utils import timezone
# Create your models here.

class Account (models.Model):
    AcNo=models.AutoField(primary_key=True)
    name=models.CharField(max_length=100)
    email=models.CharField(max_length=100,null=True,blank=True)
    password=models.CharField(max_length=255)
    phone=models.CharField(max_length=20,null=True,blank=True,unique=True)
    region = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    area = models.CharField(max_length=100, null=True, blank=True)
    zip_postal_code = models.CharField(max_length=20, null=True, blank=True)  
    
    def __str__(self):
        return f"Account: {self.AcNo} ({self.name})"
    class Meta:
        db_table = 'ACCOUNT'



class History(models.Model):
    recordNo=models.AutoField(primary_key=True)   
    crop_type=models.CharField(max_length=100) 
    account_acno = models.ForeignKey(
        'Account', 
        on_delete=models.RESTRICT, 
        to_field='AcNo' 
        
    )   
    disease = models.CharField(max_length=50)    
    
    temperature = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    humidity = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)   
  
    location = models.CharField(max_length=255, null=True, blank=True)
    record_date = models.DateTimeField(default=timezone.now)
    def __str__(self):
        return f"History: {self.crop_type} for AcNo {self.account_acno_id}"

    class Meta:
        db_table = 'HISTORY' # Ensures the table is named HISTORY in MySQL
        verbose_name_plural = "History Records"
    

    

